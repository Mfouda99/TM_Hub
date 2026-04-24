export default function SkeletonCard({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6 animate-pulse">
          <div className="w-10 h-10 bg-gray-800 rounded-2xl mb-4" />
          <div className="h-4 bg-gray-800 rounded-lg w-3/4 mb-3" />
          <div className="h-3 bg-gray-800 rounded-lg w-full mb-2" />
          <div className="h-3 bg-gray-800 rounded-lg w-5/6" />
        </div>
      ))}
    </>
  )
}
