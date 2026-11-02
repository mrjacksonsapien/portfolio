// Site-wide content shared by several components. Edit values here, not in components.
export const site = {
  name: 'Martin Soltan',
  title: 'Martin Soltan - Portfolio',
  description: "Martin Soltan's Portfolio",
  headline: { lead: 'The marriage of', main: 'Art and Systems' },
  intro:
    'Where deep system architecture meets fine art: crafting powerful, reliable code and breathtaking creative works.',
  about: [
    "I'm a software developer: a systems thinker with an engineer's hands, a mathematician's curiosity, and an artist's sensibility. I love building complex systems and understanding how computers work at their core, so I can bring that depth to my creative side and craft the best user experiences.",
  ],
  links: {
    github: 'https://github.com/mrjacksonsapien',
    linkedin: 'https://www.linkedin.com/in/martin-soltan-02297b264/',
    email: 'mailto:mrtnsoltan@gmail.com',
  },
} as const;
