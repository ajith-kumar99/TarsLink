import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <div className="w-full max-w-md px-4">
                {/* Brand header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight">TarsLink</h1>
                    <p className="text-gray-400 mt-2 text-sm">Create an account to get started</p>
                </div>
                <SignUp
                    routing="hash"
                    signInUrl="/sign-in"
                    fallbackRedirectUrl="/chat"
                />
            </div>
        </div>
    );
}
