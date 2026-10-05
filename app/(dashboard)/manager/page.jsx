"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ManagerView() {
  const [workflows, setWorkflows] = useState([])
  const [selectedScore, setSelectedScore] = useState({})
  const supabase = createClient()

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    const { data } = await supabase.from('workflows').select('*')
    if (data) setWorkflows(data)
  }

  const handleScoreSubmit = async (workflowId) => {
    const score = selectedScore[workflowId] || 4.0
    await supabase.from('workflows').update({
      quality_score: score,
      is_approved: true
    }).eq('id', workflowId)
    
    alert(`Workflow approved with Quality Score: ${score}`)
    fetchWorkflows()
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Managerial Workflow Review Gate</h1>

      <div className="space-y-4">
        {workflows.map((wf) => (
          <div key={wf.id} className="bg-white p-6 border rounded-lg shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{wf.title}</h3>
              <p className="text-sm text-gray-500">Baseline Effort: {wf.baseline_effort_hours} hrs/month</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Rubric Quality Score (1.0 - 5.0)</label>
                <input
                  type="number"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  className="border p-1 rounded w-20 text-center"
                  value={selectedScore[wf.id] || wf.quality_score || 4.0}
                  onChange={(e) => setSelectedScore({ ...selectedScore, [wf.id]: parseFloat(e.target.value) })}
                />
              </div>
              <button
                onClick={() => handleScoreSubmit(wf.id)}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm font-semibold"
              >
                Approve & Unlock Capacity
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}