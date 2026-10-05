"use client"
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const AI_TOOLS = ['ChatGPT', 'Claude', 'Notion AI', 'Enterprise Agent', 'Excel AI']

export default function EmployeeView() {
  const [taskName, setTaskName] = useState('')
  const [duration, setDuration] = useState('')
  const [deliverableSummary, setDeliverableSummary] = useState('')
  const [selectedTools, setSelectedTools] = useState([])
  const supabase = createClient()

  const toggleTool = (tool) => {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Zero-Document Submission Rule: Metadata only
    const { error } = await supabase.from('workflow_steps').insert({
      task_name: taskName,
      duration_hours: parseFloat(duration),
      deliverable_summary: deliverableSummary,
      tools_tagged: selectedTools,
      status: 'HANDED_OFF',
      step_order: 1
    })

    if (!error) {
      alert('Task logging submitted successfully!')
      setTaskName('')
      setDuration('')
      setDeliverableSummary('')
      setSelectedTools([])
    }
  }

  return (
    <div className="max-w-2xl mx-auto my-8 bg-white p-8 border rounded-xl shadow-sm">
      <h1 className="text-xl font-bold mb-6 text-gray-800">Task Completion & Handoff Logging</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Task Title</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="e.g. Pull market comparables & log vendor rates"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">AI Tools Tagged</label>
          <div className="flex flex-wrap gap-2">
            {AI_TOOLS.map((tool) => (
              <button
                type="button"
                key={tool}
                onClick={() => toggleTool(tool)}
                className={`px-3 py-1 text-sm border rounded-full transition ${
                  selectedTools.includes(tool) ? 'bg-black text-white' : 'bg-gray-100'
                }`}
              >
                {tool}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Duration (Hours)</label>
          <input
            type="number"
            step="0.1"
            className="w-full border p-2 rounded"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Deliverable Summary (Text Only — Zero File Uploads)</label>
          <textarea
            className="w-full border p-2 rounded h-24"
            placeholder="Vendor rate sheet and comparative analysis table completed..."
            value={deliverableSummary}
            onChange={(e) => setDeliverableSummary(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold">
          Submit Task & Hand Off
        </button>
      </form>
    </div>
  )
}