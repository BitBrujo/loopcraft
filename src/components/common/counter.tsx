'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CounterProps {
  initialValue?: number
  title?: string
}

export function Counter({ initialValue = 0, title = "Counter" }: CounterProps) {
  const [count, setCount] = useState(initialValue)

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="text-4xl font-bold">{count}</div>
        <div className="flex space-x-2">
          <Button onClick={() => setCount(count - 1)} variant="outline">
            -
          </Button>
          <Button onClick={() => setCount(initialValue)} variant="secondary">
            Reset
          </Button>
          <Button onClick={() => setCount(count + 1)}>
            +
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}