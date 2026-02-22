export default {
    providers: [
        {
            // Your Clerk Frontend API domain (from JWT template issuer URL)
            domain: "https://noble-flamingo-35.clerk.accounts.dev",
            // Must match the JWT template name — "convex" is the default Convex preset
            applicationID: "convex",
        },
    ],
};
