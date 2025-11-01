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
	Architectures []string `json:"architectures,omitempty"`
	SourceRepo    string   `json:"source_repo,omitempty"` // Yeni: Kaynak repo (çakışma çözümü için)
}

// Hafif paket bilgisi (liste için)
type PackageLight struct {
	Name          string   `json:"name"`
	Version       string   `json:"version"`
	Description   string   `json:"description"`
	Repo          string   `json:"repo"`
	Architectures []string `json:"architectures,omitempty"`
	SourceRepo    string   `json:"source_repo,omitempty"`
}

// Ana JSON yapısı
type PackageDatabase struct {
	Packages []PackageLight        `json:"packages"`
	Details  map[string]Package    `json:"details"`
	Metadata map[string]interface{} `json:"metadata"`
}

// Depo URL'leri - Tüm mimariler ve repositoriler için
var repoURLs = map[string]map[string]string{
	"x86_64": {
		"alpine-community": "https://dl-cdn.alpinelinux.org/alpine/latest-stable/community/x86_64/APKINDEX.tar.gz",
		"alpine-main":      "https://dl-cdn.alpinelinux.org/alpine/latest-stable/main/x86_64/APKINDEX.tar.gz",
		"shaanos-core":     "https://dl-os.shvn.tr/core/x86_64/APKINDEX.tar.gz",
	},
	"x86": {
		"alpine-community": "https://dl-cdn.alpinelinux.org/alpine/latest-stable/community/x86/APKINDEX.tar.gz",
		"alpine-main":      "https://dl-cdn.alpinelinux.org/alpine/latest-stable/main/x86/APKINDEX.tar.gz",
		"shaanos-core":     "https://dl-os.shvn.tr/core/x86/APKINDEX.tar.gz",
	},
}

// Repo öncelik sırası (yüksek öncelikli olan üstte)
var repoPriority = []string{
	"shaanos-core",     // En yüksek öncelik
	"alpine-main",      // Orta öncelik  
	"alpine-community", // En düşük öncelik
}

const OUTPUT_FILE = "packages.json"

func main() {
	fmt.Println("🦅 Alpine Linux + ShaanOS Paket Veritabanı Oluşturucu")
	fmt.Println("=====================================================")

	// Tüm mimarilerden paketleri topla
	allPackagesByArch := make(map[string][]Package)

	// Her mimari için paketleri indir
	for arch, repos := range repoURLs {
		fmt.Printf("\n--- %s Mimarisi İşleniyor ---\n", strings.ToUpper(arch))
		
		archPackages := []Package{}
		
		// Repoları öncelik sırasına göre işle
		for _, repoKey := range repoPriority {
			if url, exists := repos[repoKey]; exists {
				fmt.Printf("📦 %s Deposu\n", getRepoDisplayName(repoKey))
				packages, err := parseAPKIndex(url, getRepoDisplayName(repoKey), repoKey, arch)
				if err != nil {
					fmt.Printf("❌ %s hatası: %v\n", getRepoDisplayName(repoKey), err)
				} else {
					fmt.Printf("✅ %s: %d paket\n", getRepoDisplayName(repoKey), len(packages))
					archPackages = append(archPackages, packages...)
				}
			}
		}

		allPackagesByArch[arch] = archPackages
		fmt.Printf("🎯 %s Toplam: %d paket\n", strings.ToUpper(arch), len(archPackages))
	}

	// Tüm mimarilerden gelen paketleri birleştir ve çakışmaları çöz
	fmt.Printf("\n--- Paketler Birleştiriliyor ve Çakışmalar Çözülüyor ---\n")
	combinedPackages := combineAndResolvePackages(allPackagesByArch)

	// JSON veritabanını oluştur
	fmt.Printf("\n--- JSON Veritabanı Oluşturuluyor ---\n")
	if err := createPackageDatabase(combinedPackages, OUTPUT_FILE); err != nil {
		fmt.Printf("❌ JSON oluşturma hatası: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("🎉 Başarılı! Toplam %d paket '%s' dosyasına kaydedildi.\n", len(combinedPackages), OUTPUT_FILE)
}

// Repo anahtarından görünen ismi al
func getRepoDisplayName(repoKey string) string {
	names := map[string]string{
		"alpine-main":      "Alpine Main",
		"alpine-community": "Alpine Community", 
		"shaanos-core":     "ShaanOS Core",
	}
	if name, exists := names[repoKey]; exists {
		return name
	}
	return repoKey
}

// Repo önceliğini kontrol et
func getRepoPriority(repo string) int {
	for i, repoKey := range repoPriority {
		if repoKey == repo {
			return i
		}
	}
	return len(repoPriority) // En düşük öncelik
}

// Farklı mimarilerden gelen paketleri birleştir ve çakışmaları çöz
func combineAndResolvePackages(packagesByArch map[string][]Package) []Package {
	// Paketleri isme göre grupla - çakışma çözümü ile
	packageMap := make(map[string]*Package)
	archCounts := make(map[string]int)
	conflictResolutions := make(map[string]string)

	for arch, packages := range packagesByArch {
		archCounts[arch] = len(packages)
		for _, pkg := range packages {
			key := pkg.Name
			
			if existing, exists := packageMap[key]; exists {
				// Paket zaten var - çakışma çözümü uygula
				existingRepoPriority := getRepoPriority(existing.SourceRepo)
				newRepoPriority := getRepoPriority(pkg.SourceRepo)
				
				if newRepoPriority < existingRepoPriority {
					// Yeni paket daha yüksek öncelikli - değiştir
					conflictResolutions[key] = fmt.Sprintf("%s -> %s", existing.SourceRepo, pkg.SourceRepo)
					newPkg := pkg
					newPkg.Architectures = append([]string{}, existing.Architectures...)
					if !contains(newPkg.Architectures, arch) {
						newPkg.Architectures = append(newPkg.Architectures, arch)
					}
					packageMap[key] = &newPkg
				} else {
					// Mevcut paket daha yüksek öncelikli - mimari ekle
					if !contains(existing.Architectures, arch) {
						existing.Architectures = append(existing.Architectures, arch)
					}
				}
			} else {
				// Yeni paket
				newPkg := pkg
				newPkg.Architectures = []string{arch}
				packageMap[key] = &newPkg
			}
		}
	}

	// Map'ten slice'a dönüştür
	result := make([]Package, 0, len(packageMap))
	for _, pkg := range packageMap {
		result = append(result, *pkg)
	}

	// İstatistikleri yazdır
	fmt.Printf("📊 Mimari Dağılımı:\n")
	for arch, count := range archCounts {
		fmt.Printf("   • %s: %d paket\n", strings.ToUpper(arch), count)
	}
	
	if len(conflictResolutions) > 0 {
		fmt.Printf("🔀 Çözülen Çakışmalar (%d):\n", len(conflictResolutions))
		for pkg, resolution := range conflictResolutions {
			fmt.Printf("   • %s: %s\n", pkg, resolution)
		}
	}
	
	fmt.Printf("   • Birleştirilmiş: %d benzersiz paket\n", len(result))

	return result
}

// String slice'ında eleman var mı kontrol et
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
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

func parseAPKIndex(url string, repo string, sourceRepo string, arch string) ([]Package, error) {
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
	currentPkg := Package{Repo: repo, SourceRepo: sourceRepo, Architecture: arch}

	for scanner.Scan() {
		line := scanner.Text()
		if line == "" {
			if currentPkg.Name != "" {
				packages = append(packages, currentPkg)
			}
			currentPkg = Package{Repo: repo, SourceRepo: sourceRepo, Architecture: arch}
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
	repoCounts := make(map[string]int)
	archCounts := make(map[string]int)
	sourceRepoCounts := make(map[string]int)
	totalPackageSize := 0
	totalInstalledSize := 0

	for _, pkg := range packages {
		// Repo istatistikleri
		repoCounts[pkg.Repo]++
		sourceRepoCounts[pkg.SourceRepo]++
		
		// Mimari istatistikleri
		for _, arch := range pkg.Architectures {
			archCounts[arch]++
		}

		// Hafif liste
		packagesLight = append(packagesLight, PackageLight{
			Name:          pkg.Name,
			Version:       pkg.Version,
			Description:   pkg.Description,
			Repo:          pkg.Repo,
			Architectures: pkg.Architectures,
			SourceRepo:    pkg.SourceRepo,
		})

		// Detaylı bilgiler
		details[pkg.Name] = pkg

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
		"repositories":            repoCounts,
		"source_repositories":     sourceRepoCounts,
		"architectures":           archCounts,
		"total_package_size_mb":   totalPackageSize / 1024 / 1024,
		"total_installed_size_mb": totalInstalledSize / 1024 / 1024,
		"last_updated":            time.Now().Format(time.RFC3339),
		"alpine_version":          "latest-stable",
		"repo_priority":           repoPriority,
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
	fmt.Printf("\n📊 Detaylı İstatistikler:\n")
	fmt.Printf("   • Toplam Paket: %d\n", len(packages))
	fmt.Printf("   • Repolar:\n")
	for repo, count := range repoCounts {
		fmt.Printf("     - %s: %d\n", repo, count)
	}
	fmt.Printf("   • Kaynak Repolar:\n")
	for repo, count := range sourceRepoCounts {
		fmt.Printf("     - %s: %d\n", repo, count)
	}
	fmt.Printf("   • Mimari Dağılımı:\n")
	for arch, count := range archCounts {
		fmt.Printf("     - %s: %d\n", arch, count)
	}
	fmt.Printf("   • Toplam Paket Boyutu: %d MB\n", totalPackageSize/1024/1024)
	fmt.Printf("   • Toplam Kurulum Boyutu: %d MB\n", totalInstalledSize/1024/1024)

	return nil
}
