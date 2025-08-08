import { Counter } from '@/components/common/counter'
import { Toggle } from '@/components/common/toggle'
import { SearchFilter } from '@/components/common/search-filter'
import { AnimatedCard } from '@/components/common/animated-card'
import { Navigation } from '@/components/layout/navigation'

const sampleItems = [
  { id: '1', title: 'React Basics', category: 'tutorial', content: 'Learn the fundamentals of React' },
  { id: '2', title: 'Next.js Guide', category: 'tutorial', content: 'Complete guide to Next.js' },
  { id: '3', title: 'Project Ideas', category: 'inspiration', content: '10 cool project ideas' },
  { id: '4', title: 'TypeScript Tips', category: 'tutorial', content: 'Advanced TypeScript techniques' },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-foreground mb-8">Dashboard</h1>

          {/* Interactive Components Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Counter title="Page Views" initialValue={42} />
            <Toggle title="Dark Mode" />
            <div className="grid gap-2">
              <AnimatedCard
                title="Welcome!"
                content="This is your dashboard"
                delay={0.1}
              />
            </div>
          </div>

          {/* Search and Filter */}
          <div className="mb-8">
            <SearchFilter items={sampleItems} title="Content Library" />
          </div>

          {/* Animated Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <AnimatedCard
                key={i}
                title={`Feature ${i}`}
                content={`This is feature number ${i} with some sample content`}
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}