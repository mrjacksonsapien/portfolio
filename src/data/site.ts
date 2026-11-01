// Site-wide content shared by several components. Edit values here, not in components.
export const site = {
  name: 'Martin Soltan',
  description: "Martin Soltan's Portfolio",
  headline: { lead: 'Experience in', main: 'first row seats.' },
  intro:
    'Where deep system architecture meets fine art: crafting powerful, reliable code and breathtaking creative works.',
  about:
    "I'm a systems programmer who loves building complex systems and understand how computers work fundamentally so I can enhance my creative side to make the best user experiences.",
  links: {
    github: 'https://github.com/mrjacksonsapien',
    linkedin: 'https://www.linkedin.com/in/martin-soltan-02297b264/',
    email: 'mailto:mrtnsoltan@gmail.com',
  },
} as const;
