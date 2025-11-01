# 📦 ShaanOS Packages Browser

Welcome to the ShaanOS Packages Browser, a modern, fast, and intuitive web application for exploring the software packages available for the ShaanOS operating system.

---

## ✨ Key Features

*   **⚡ Blazing Fast Search:** Instantly find any package by name or description.
*   **Advanced Filtering:** Narrow down your search by repository (ShaanOS Core, Alpine Main, etc.) and architecture (x86_64, x86).
*   **Comprehensive Details:** View detailed information for each package, including version, size, dependencies, license, and more.
*   **Repository Statistics:** Get a high-level overview of the package ecosystem with at-a-glance stats.
*   **Conflict Resolution:** Smart logic prioritizes `ShaanOS Core` packages to ensure you always see the most relevant version.
*   **📱 Responsive Design:** A clean, mobile-first interface that works beautifully on any device, from desktops to smartphones.

## 💻 Tech Stack

This project is built with a modern, performant, and scalable tech stack:

*   [**Next.js**](https://nextjs.org/) - React Framework for Production (App Router)
*   [**React**](https://react.dev/) - The library for web and native user interfaces
*   [**Tailwind CSS**](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development.
*   [**ShadCN/UI**](https://ui.shadcn.com/) - Re-usable components built using Radix UI and Tailwind CSS.
*   [**TypeScript**](https://www.typescriptlang.org/) - Strong-typed JavaScript for better code quality.
*   **Lucide React:** Beautiful and consistent icons.

## 🚀 Getting Started Locally

Want to run this project on your own machine? Follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/shaanvision/shaanos-packages-browser.git
    cd shaanos-packages-browser
    ```

2.  **Install dependencies:**
    This project uses `npm` for package management.
    ```bash
    npm install
    ```
    _This will also automatically run the `postinstall` script to fetch the latest package data._

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:9002](http://localhost:9002) in your browser to see the result.

## 🔄 How Data is Handled

This project is optimized for performance by fetching all package data at build time.

*   The `fetch-packages.js` script runs during the `postinstall` and `build` steps.
*   It downloads a comprehensive JSON file from a remote source.
*   The data is saved locally to `public/packages.json`.
*   The application then uses this local file, eliminating the need for client-side API calls to an external server and ensuring the app is fast and can even work offline (as a PWA).

## ❤️ Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information. (Note: A LICENSE file would need to be created).
