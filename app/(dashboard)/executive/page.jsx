"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateWorkflowMetrics, calculateAdoptionIndex } from '@/lib/analytics'

export default function ExecutiveDashboard() {
  const [metrics, setMetrics] = useState({ totalUnlockedCapacityHours: 0, financialValueRealized: 0, fteEquivalentGain: 0 })
  const [adoptionIndex, setAdoptionIndex] = useState(0)

  useEffect(() => {
    // Sample calculation execution matching baseline math specs
    const mockWorkflowData = [
      { baselineEffortHours: 40, aiEffortHours: 15, monthlyOutputVolume: 4, qualityScore: 4.5, blendedHourlyRate: 75 }
    ]
    const calculated = calculateWorkflowMetrics(mockWorkflowData)
    setMetrics(calculated)

    const index = calculateAdoptionIndex(80, 90, 85, 70)
    setAdoptionIndex(index)
  }, [])

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Executive Strategic Dashboard</h1>

      {/* High-Level Impact Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 border rounded-lg shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Unlocked Monthly Capacity</p>
          <p className="text-3xl font-bold text-blue-600">{metrics.totalUnlockedCapacityHours} hrs</p>
        </div>
        <div className="bg-white p-6 border rounded-lg shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Financial Value Realized</p>
          <p className="text-3xl font-bold text-green-600">${metrics.financialValueRealized.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 border rounded-lg shadow-sm">
          <p className="text-sm text-gray-500 font-medium">FTE Throughput Gain</p>
          <p className="text-3xl font-bold text-purple-600">{metrics.fteEquivalentGain.toFixed(1)} FTEs</p>
        </div>
        <div className="bg-white p-6 border rounded-lg shadow-sm">
          <p className="text-sm text-gray-500 font-medium">AI Adoption Index</p>
          <p className="text-3xl font-bold text-indigo-600">{adoptionIndex}%</p>
        </div>
      </div>
    </div>
  )
}