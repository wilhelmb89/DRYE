/** @type {import('tailwindcss').Config} */
module.exports = {
    mode: "jit",
    content: ["./**/*.liquid", "./src/**/*.{js,ts,jsx,tsx}", "./templates/**/*.{liquid,json}"],
    theme: {
        extend: {}
    },
    plugins: [],
    blocklist: ["container"]
};
