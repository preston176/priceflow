"use client";

export default function VideoSection() {
  return (
    <section id="how-it-works" className="py-24 bg-neutral-900 text-white">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-semibold mb-4">
            See{" "}
            <span className="text-teal-400">PriceFlow</span> in Action
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Watch how easy it is to track prices and never overpay again
          </p>
        </div>

        {/* Video Container */}
        <div className="relative aspect-video max-w-4xl mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1"
            title="PriceFlow Demo"
            style={{ border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Optional: Video Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-400 mb-1">2 min</div>
            <div className="text-sm text-slate-400">Quick walkthrough</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-400 mb-1">3 Steps</div>
            <div className="text-sm text-slate-400">To start saving</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-400 mb-1">0 Cost</div>
            <div className="text-sm text-slate-400">Free forever</div>
          </div>
        </div>
      </div>
    </section>
  );
}
