export default function Hello() {
  return (
    <section className="w-full max-w-2xl mx-auto p-6">
      {/* Title */}
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-blue-600">
          Welcome to NEU Translator!
        </h1>
      </header>

      {/* Intro */}
      <p className="mb-3 text-base text-gray-800 dark:text-gray-200">
        A powerful translation tool that helps you translate text with AI
        assistance.
      </p>

      {/* Subtitle */}
      <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
        Here are some example prompts to get you started:
      </p>

      {/* Examples */}
      <ul className="mb-6 space-y-2 pl-4">
        <li className="flex">
          <span className="mr-2 text-green-500">•</span>
          <span className="text-gray-800 dark:text-gray-200">
            "Translate this text to Chinese: Hello, how are you today?"
          </span>
        </li>
        <li className="flex">
          <span className="mr-2 text-green-500">•</span>
          <span className="text-gray-800 dark:text-gray-200">
            "Help me translate this document from English to Spanish"
          </span>
        </li>
        <li className="flex">
          <span className="mr-2 text-green-500">•</span>
          <span className="text-gray-800 dark:text-gray-200">
            "What's the best way to translate technical terms?"
          </span>
        </li>
        <li className="flex">
          <span className="mr-2 text-green-500">•</span>
          <span className="text-gray-800 dark:text-gray-200">
            "Translate and preserve the formatting of this markdown file"
          </span>
        </li>
      </ul>

      {/* Footer hint */}
      <footer>
        <p className="italic text-sm text-gray-500 dark:text-gray-400">
          Type your message below to start translating! ✨
        </p>
      </footer>
    </section>
  );
}
