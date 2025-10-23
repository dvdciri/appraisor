import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Property Search - Appraisor',
  description: 'Search and analyze UK properties with detailed insights and investment calculations.',
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
