'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ToggleProps {
  title?: string
  onToggle?: (isOn: boolean) => void
}

export function Toggle({ title = "Toggle", onToggle }: ToggleProps) {
  const [isOn, setIsOn] = useState(false)

  const handleToggle = () => {
    const newState = !isOn
    setIsOn(newState)
    onToggle?.(newState)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="text-2xl">
          {isOn ? '🟢 ON' : '🔴 OFF'}
        </div>
        <Button onClick={handleToggle} variant={isOn ? 'default' : 'outline'}>
          {isOn ? 'Turn Off' : 'Turn On'}
        </Button>
      </CardContent>
    </Card>
  )
}