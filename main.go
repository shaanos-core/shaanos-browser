package main

import (
	"archive/tar"
	"bufio"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// Paket bilgilerini tutacak struct - Tüm alanlar eklendi
type Package struct {
	Checksum      string   `json:"checksum,omitempty"`
	Name          string   `json:"name"`
	Version       string   `json:"version"`
	Architecture  string   `json:"architecture,omitempty"`
	PackageSize   string   `json:"package_size,omitempty"`
	InstalledSize string   `json:"installed_size,omitempty"`
	Description   string   `json:"description,omitempty"`
	URL           string   `json:"url,omitempty"`
	License       string   `json:"license,omitempty"`
	Origin        string   `json:"origin,omitempty"`
	Maintainer    string   `json:"maintainer,omitempty"`
	BuildTime     string   `json:"build_time,omitempty"`
	Dependencies  []string `json:"dependencies,omitempty"`
	Provides      []string `json:"provides,omitempty"`
	InstallIf     []string `json:"install_if,omitempty"`
	Repo          string   `json:"repo"`
}

// Hafif paket bilgisi (liste için)
type PackageLight struct {
	Name        string `json:"name"`
	Version     string `json:"version"`
	Description string `json:"description"`
	Repo        string `json:"repo"`
}

// Ana JSON yapısı
type PackageDatabase struct {
	Packages []PackageLight        `json:"packages"`
	Details  map[string]Package    `json:"details"`
	Metadata map[string]interface{} `json:"metadata"`
}

// Depo URL'leri
const (
	COMMUNITY_URL = "https://dl-cdn.alpinelinux.org/alpine/latest-stable/community/x86_64/APKINDEX.tar.gz"
	MAIN_URL      = "https://dl-cdn.alpinelinux.org/alpine/latest-stable/main/x86_64/APKINDEX.tar.gz"
	OUTPUT_FILE   = "packages.json"
)

func main() {
	fmt.Println("🦅 Alpine Linux Paket Veritabanı Oluşturucu")
	fmt.Println("===========================================")

	// Tüm paketleri topla
	allPackages := []Package{}

	// Community deposunu işle
	fmt.Printf("\n--- Community Deposu İşleniyor ---\n")
	communityPkgs, err := parseAPKIndex(COMMUNITY_URL, "community")
	if err != nil {
		fmt.Printf("❌ Community hatası: %v\n", err)
	} else {
		fmt.Printf("✅ Community: %d paket\n", len(communityPkgs))
		allPackages = append(allPackages, communityPkgs...)
	}

	// Main deposunu işle
	fmt.Printf("\n--- Main Deposu İşleniyor ---\n")
	mainPkgs, err := parseAPKIndex(MAIN_URL, "main")
	if err != nil {
		fmt.Printf("❌ Main hatası: %v\n", err)
	} else {
		fmt.Printf("✅ Main: %d paket\n", len(mainPkgs))
		allPackages = append(allPackages, mainPkgs...)
	}

	// JSON veritabanını oluştur
	fmt.Printf("\n--- JSON Veritabanı Oluşturuluyor ---\n")
	if err := createPackageDatabase(allPackages, OUTPUT_FILE); err != nil {
		fmt.Printf("❌ JSON oluşturma hatası: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("🎉 Başarılı! Toplam %d paket '%s' dosyasına kaydedildi.\n", len(allPackages), OUTPUT_FILE)
}

func parseDependencies(value string) []string {
	if value == "" {
		return []string{}
	}

	deps := []string{}
	for _, dep := range strings.Split(value, " ") {
		dep = strings.TrimSpace(dep)
		if dep == "" {
			continue
		}

		// Özel bağımlılıkları atla (so:, cmd:, pc:)
		if strings.HasPrefix(dep, "so:") || strings.HasPrefix(dep, "cmd:") || strings.HasPrefix(dep, "pc:") {
			continue
		}

		// Conflict'leri atla (! ile başlayanlar)
		if strings.HasPrefix(dep, "!") {
			continue
		}

		// Karşılaştırma operatörlerini kaldır
		dep = strings.Split(dep, ">=")[0]
		dep = strings.Split(dep, ">")[0]
		dep = strings.Split(dep, "<=")[0]
		dep = strings.Split(dep, "<")[0]
		dep = strings.Split(dep, "=")[0]

		if dep != "" {
			deps = append(deps, dep)
		}
	}
	return deps
}

func parseProvides(value string) []string {
	if value == "" {
		return []string{}
	}

	provides := []string{}
	for _, item := range strings.Split(value, " ") {
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}

		// = işaretinden öncesini al
		provideName := strings.Split(item, "=")[0]
		if provideName != "" {
			provides = append(provides, provideName)
		}
	}
	return provides
}

func parseAPKIndex(url string, repo string) ([]Package, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("indirme hatası: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP hatası: %s", resp.Status)
	}

	gzr, err := gzip.NewReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("gzip hatası: %w", err)
	}
	defer gzr.Close()

	tr := tar.NewReader(gzr)

	var indexContent io.Reader
	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("tar okuma hatası: %w", err)
		}

		if header.Name == "APKINDEX" {
			indexContent = tr
			break
		}
	}

	if indexContent == nil {
		return nil, fmt.Errorf("APKINDEX dosyası tar arşivinde bulunamadı")
	}

	const maxCapacity = 1024 * 1024
	buf := make([]byte, maxCapacity)

	scanner := bufio.NewScanner(indexContent)
	scanner.Buffer(buf, maxCapacity)

	packages := []Package{}
	currentPkg := Package{Repo: repo}

	for scanner.Scan() {
		line := scanner.Text()
		if line == "" {
			if currentPkg.Name != "" {
				packages = append(packages, currentPkg)
			}
			currentPkg = Package{Repo: repo}
			continue
		}

		parts := strings.SplitN(line, ":", 2)
		if len(parts) != 2 {
			continue
		}

		key := parts[0]
		value := parts[1]

		switch key {
		case "C":
			currentPkg.Checksum = value
		case "P":
			currentPkg.Name = value
		case "V":
			currentPkg.Version = value
		case "A":
			currentPkg.Architecture = value
		case "S":
			currentPkg.PackageSize = value
		case "I":
			currentPkg.InstalledSize = value
		case "T":
			currentPkg.Description = value
		case "U":
			currentPkg.URL = value
		case "L":
			currentPkg.License = value
		case "o":
			currentPkg.Origin = value
		case "m":
			currentPkg.Maintainer = value
		case "t":
			currentPkg.BuildTime = value
		case "D":
			currentPkg.Dependencies = parseDependencies(value)
		case "p":
			currentPkg.Provides = parseProvides(value)
		case "i":
			currentPkg.InstallIf = parseDependencies(value)
		}
	}

	if currentPkg.Name != "" {
		packages = append(packages, currentPkg)
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("scanner hatası: %w", err)
	}

	return packages, nil
}

func createPackageDatabase(packages []Package, filename string) error {
	// Hafif paket listesi oluştur
	packagesLight := []PackageLight{}
	// Detaylı paket bilgileri
	details := make(map[string]Package)

	// İstatistikler
	mainCount := 0
	communityCount := 0
	totalPackageSize := 0
	totalInstalledSize := 0

	for _, pkg := range packages {
		// Hafif liste
		packagesLight = append(packagesLight, PackageLight{
			Name:        pkg.Name,
			Version:     pkg.Version,
			Description: pkg.Description,
			Repo:        pkg.Repo,
		})

		// Detaylı bilgiler
		details[pkg.Name] = pkg

		// İstatistikler
		if pkg.Repo == "main" {
			mainCount++
		} else if pkg.Repo == "community" {
			communityCount++
		}

		// Boyut hesaplamaları
		if pkg.PackageSize != "" {
			var size int
			fmt.Sscanf(pkg.PackageSize, "%d", &size)
			totalPackageSize += size
		}
		if pkg.InstalledSize != "" {
			var size int
			fmt.Sscanf(pkg.InstalledSize, "%d", &size)
			totalInstalledSize += size
		}
	}

	// Metadata
	metadata := map[string]interface{}{
		"total_packages":          len(packages),
		"main_packages":           mainCount,
		"community_packages":      communityCount,
		"total_package_size_mb":   totalPackageSize / 1024 / 1024,
		"total_installed_size_mb": totalInstalledSize / 1024 / 1024,
		"last_updated":            time.Now().Format(time.RFC3339),
		"alpine_version":          "latest-stable",
	}

	// Ana veritabanı
	database := PackageDatabase{
		Packages: packagesLight,
		Details:  details,
		Metadata: metadata,
	}

	// JSON'a dönüştür ve kaydet
	jsonData, err := json.MarshalIndent(database, "", "  ")
	if err != nil {
		return fmt.Errorf("JSON'a dönüştürme hatası: %w", err)
	}

	err = os.WriteFile(filename, jsonData, 0644)
	if err != nil {
		return fmt.Errorf("dosyaya yazma hatası: %w", err)
	}

	// İstatistikleri yazdır
	fmt.Printf("\n📊 İstatistikler:\n")
	fmt.Printf("   • Toplam Paket: %d\n", len(packages))
	fmt.Printf("   • Main Repo: %d\n", mainCount)
	fmt.Printf("   • Community Repo: %d\n", communityCount)
	fmt.Printf("   • Toplam Paket Boyutu: %d MB\n", totalPackageSize/1024/1024)
	fmt.Printf("   • Toplam Kurulum Boyutu: %d MB\n", totalInstalledSize/1024/1024)

	return nil
}
