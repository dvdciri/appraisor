import './globals.css'
import DatabaseInitializer from './components/DatabaseInitializer'

export const metadata = {
  title: 'Appraisor - All Your Property Insights in One Search',
  description: 'Get instant access to over 45 data points, automatic valuations, AI-driven insights, and tools to help you buy and sell smarter. Sign up for early access.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen">
        <DatabaseInitializer />
        {children}
      </body>
    </html>
  )
}
