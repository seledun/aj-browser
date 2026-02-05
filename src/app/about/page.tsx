
export default function AboutPage() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-4">About This Project</h1>
        <p className="text-lg text-default-600 mb-6">
            This project is an open-source archive browser for banned.video, built using Next.js and Tailwind CSS. It provides a user-friendly interface to explore the archived content from banned.video, including videos, comments, and more from the platform's history.
        </p>
        <p className="text-lg text-default-600 mb-6">
            The archive is sourced from database dumps of banned.video, which are processed and indexed to allow for efficient browsing. The project is actively maintained and updated as new data becomes available.
        </p>
        <p className="text-lg text-default-600 mb-6">
            If you're interested in contributing or have any questions, feel free to check out the GitHub repository or reach out to the maintainer.
        </p>
        <div className="border border-divider rounded-lg p-6 text-center text-default-500">
            <p className="text-lg">GitHub Repository: <a href="https://github.com/seledun/aj-browser" target="_blank" className="text-blue-500 hover:underline">https://github.com/seledun/aj-browser</a></p>
        </div>
        </div>
    );
}