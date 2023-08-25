const konstaConfig = require('konsta/config')
/** @type {import('tailwindcss').Config} */
module.exports = konstaConfig({
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    // fontFamily: {
    //   ios: 'my-ios-font',
    //   material: 'my-material-font',
    // },
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
})
