import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
				// My custom colors
				beige: {
					500: '#98908B',
					100: '#F8F4F0',
				},
				grey: {
					100: '#F2F2F2',
					300: '#B3B3B3',
					500: '#696868',
					900: '#201F24',
				},
				green: '#277C78',
				yellow: '#F2CDAC',
				cyan: '#82C9D7',
				navy: '#626070',
				red: '#C94736',
				purple: '#826CB0',
				'other-purple': '#AF81BA',
				turquoise: '#597C7C',
				brown: '#93674F',
				magenta: '#934F6F',
				blue: '#3F82B2',
				'navy-gray': '#97A0AC',
				'army-green': '#7F9161',
				gold: '#CAB361',
				orange: '#BE6C49',
				// Shadcn colors
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
			spacing: {
				500: '40px',
				400: '32px',
				300: '24px',
				250: '20px',
				200: '16px',
				150: '12px',
				100: '8px',
				50: '4px'
			},
  	},
  },
	safelist: [
		'bg-green',
		'bg-yellow',
		'bg-cyan',
		'bg-navy',
		'bg-red',
		'bg-purple',
		'bg-other-purple',
		'bg-turquoise',
		'bg-brown',
		'bg-magenta',
		'bg-blue',
		'bg-navy-gray',
		'bg-army-green',
		'bg-gold',
		'bg-orange',
	],
  plugins: [require("tailwindcss-animate")],
};
export default config;
