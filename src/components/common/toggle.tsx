'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/components/theme/theme-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ToggleProps {
  title?: string
  onToggle?: (isOn: boolean) => void
}

export function Toggle({ title = "Dark Mode", onToggle }: ToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isDark = theme === 'dark'

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setTheme(newTheme)
    onToggle?.(!isDark)
  }

  if (!mounted) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className="text-2xl">☀️ Light</div>
          <Button variant="outline">Switch to Dark</Button>
        </CardContent>
      </Card>
    )
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