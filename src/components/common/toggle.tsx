'use client'

import { useTheme } from '@/components/theme/theme-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ToggleProps {
  title?: string
  onToggle?: (isOn: boolean) => void
}

export function Toggle({ title = "Dark Mode", onToggle }: ToggleProps) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  const handleToggle = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setTheme(newTheme)
    onToggle?.(!isDark)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="text-2xl">
          {isDark ? '🌙 Dark' : '☀️ Light'}
        </div>
        <Button onClick={handleToggle} variant={isDark ? 'default' : 'outline'}>
          {isDark ? 'Switch to Light' : 'Switch to Dark'}
        </Button>
      </CardContent>
    </Card>
  )
}