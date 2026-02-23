import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
            {/* ── Left branding panel ── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-900">
                {/* Decorative geometric shapes */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[10%] left-[15%] w-32 h-32 border border-white/10 rounded-2xl rotate-12" />
                    <div className="absolute top-[25%] right-[10%] w-48 h-48 border border-white/10 rounded-3xl -rotate-12" />
                    <div className="absolute bottom-[15%] left-[10%] w-24 h-24 border border-white/10 rounded-xl rotate-45" />
                    <div className="absolute bottom-[30%] right-[20%] w-40 h-40 border border-white/10 rounded-2xl rotate-6" />
                    <div className="absolute top-[50%] left-[40%] w-20 h-20 bg-white/5 rounded-full" />
                    <div className="absolute top-[15%] right-[30%] w-16 h-16 bg-white/5 rounded-full" />
                    <div className="absolute bottom-[10%] right-[15%] w-28 h-28 bg-white/5 rounded-2xl rotate-12" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
                    {/* Logo icon */}
                    <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-8 shadow-2xl">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                    </div>

                    <h2 className="text-4xl font-bold text-white tracking-tight mb-3">TarsLink</h2>
                    <p className="text-indigo-200 text-center text-base max-w-xl leading-relaxed">
                        Real-time messaging built for teams and individuals
                    </p>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-2 mt-10 justify-center">
                        {["End-to-End Chat", "Group Messaging","Reactions"].map((f) => (
                            <span key={f} className="px-3 py-1.5 text-xs font-medium text-white/80 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm">
                                {f}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                {/* Subtle decorative shapes (right panel) */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[5%] right-[5%] w-40 h-40 border border-gray-200 dark:border-gray-800 rounded-3xl rotate-12 opacity-40" />
                    <div className="absolute bottom-[10%] left-[8%] w-28 h-28 border border-gray-200 dark:border-gray-800 rounded-2xl -rotate-6 opacity-30" />
                    <div className="absolute top-[40%] right-[15%] w-16 h-16 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full" />
                </div>

                <div className="relative z-10 w-full max-w-md px-6">
                    {/* Mobile-only branding */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/25 mb-4">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                        </div>
                    </div>

                 

                    <SignUp
                        routing="hash"
                        signInUrl="/sign-in"
                        fallbackRedirectUrl="/chat"
                        appearance={{
                            variables: {
                                colorBackground: "#ffffff",
                                colorText: "#111827",
                                colorPrimary: "#4f46e5",
                                colorInputBackground: "#f3f4f6",
                                colorInputText: "#111827",
                            },
                        }}
                    />

                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
                        Already have an account?{" "}
                        <a href="/sign-in" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
