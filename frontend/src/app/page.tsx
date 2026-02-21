import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
          The Future of <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Secure Access</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10">
          Seamlessly integrate facial recognition into your premises. Secure, fast, and coupled with a powerful loyalty program to reward your frequent visitors.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/access"
            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-1"
          >
            Enter Premises
          </Link>
          <Link
            href="/register"
            className="px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 hover:bg-slate-50 transition-all hover:-translate-y-1"
          >
            Register Now
          </Link>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: 'Biometric Security',
            desc: 'State-of-the-art facial recognition technology powered by AI.',
            icon: '🛡️'
          },
          {
            title: 'Instant Loyalty',
            desc: 'Earn points automatically on every visit. Unlock premium tiers.',
            icon: '✨'
          },
          {
            title: 'Admin Insights',
            desc: 'Real-time data and visitor analytics at your fingertips.',
            icon: '📊'
          }
        ].map((feature, i) => (
          <div key={i} className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-slate-500">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
