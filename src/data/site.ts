// Site-wide content shared by several components. Edit values here, not in components.
export const site = {
  name: 'Martin Soltan',
  title: 'Martin Soltan - Portfolio',
  description: "Martin Soltan's Portfolio",
  headline: { lead: 'The marriage of', main: 'Art and Systems' },
  intro:
    'Where deep system architecture meets fine art: crafting powerful, reliable code and breathtaking creative works.',
  about: [
    "I'm a systems programmer who loves building complex systems and understanding how computers work at their core, so I can bring that depth to my creative side and craft the best user experiences.",
    'I am also mesmerized by the fundamentals of computer science, mathematics and science, and I see them through an artistic lens as well: the elegance of an algorithm, the symmetry of an equation, the structure hiding inside a physical law.',
    'What I love most is taking a complex subject and making it simple. When I finally understand something hard, I want to find the clearest way to explain it so other people can understand it too, whether that is through a demo, a diagram or a few plain words.',
  ],
  links: {
    github: 'https://github.com/mrjacksonsapien',
    linkedin: 'https://www.linkedin.com/in/martin-soltan-02297b264/',
    email: 'mailto:mrtnsoltan@gmail.com',
  },
} as const;
