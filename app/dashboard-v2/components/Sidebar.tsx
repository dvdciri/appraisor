'use client'

export default function Sidebar() {
  return (
    <aside className="flex-shrink-0 w-[30%] min-h-0 flex flex-col">
      <div className="h-full flex flex-col">
        <div className="h-full rounded-2xl shadow-2xl backdrop-blur-xl border border-gray-500/30 bg-black/20 p-6 overflow-y-auto hide-scrollbar">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4 opacity-50">📋</div>
              <p className="text-gray-400 text-sm">Sidebar</p>
              <p className="text-gray-500 text-xs mt-2">Placeholder for future content</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

