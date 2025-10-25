'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AboutPage() {
  const { isAuthenticated } = useAuth();

  const skills = [
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python',
    'FastAPI', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS', 'Git',
    'Machine Learning', 'Data Analysis', 'System Design', 'Agile'
  ];

  const experiences = [
    {
      title: 'Senior Software Engineer',
      company: 'Tech Company',
      duration: 'Jan 2022 - Present',
      location: 'Remote',
      description: [
        'Led development of scalable web applications using React and Node.js',
        'Architected microservices infrastructure reducing response time by 40%',
        'Mentored junior developers and conducted code reviews',
        'Implemented CI/CD pipelines improving deployment efficiency'
      ]
    },
    {
      title: 'Full Stack Developer',
      company: 'Startup Inc.',
      duration: 'Mar 2020 - Dec 2021',
      location: 'San Francisco, CA',
      description: [
        'Built end-to-end web applications with modern JavaScript frameworks',
        'Developed RESTful APIs and integrated third-party services',
        'Optimized database queries resulting in 50% performance improvement',
        'Collaborated with design team to implement responsive UI/UX'
      ]
    },
    {
      title: 'Software Developer',
      company: 'Innovation Labs',
      duration: 'Jun 2018 - Feb 2020',
      location: 'New York, NY',
      description: [
        'Developed and maintained multiple client applications',
        'Implemented automated testing reducing bugs by 30%',
        'Participated in agile development processes',
        'Created technical documentation and user guides'
      ]
    }
  ];

  const education = [
    {
      degree: 'Master of Science in Computer Science',
      institution: 'University Name',
      duration: '2016 - 2018',
      description: 'Specialized in Machine Learning and Data Science'
    },
    {
      degree: 'Bachelor of Technology in Computer Engineering',
      institution: 'Engineering College',
      duration: '2012 - 2016',
      description: 'Graduated with First Class Honors'
    }
  ];

  const projects = [
    {
      name: 'WhisperVault',
      description: 'Anonymous confession sharing platform with JWT authentication and moderation system',
      technologies: ['Next.js', 'FastAPI', 'PostgreSQL', 'Docker'],
      github: 'https://github.com/sumitmallick/WhisperVault',
      live: null
    },
    {
      name: 'E-Commerce Platform',
      description: 'Full-stack e-commerce solution with payment integration and admin dashboard',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      github: '#',
      live: '#'
    },
    {
      name: 'Data Analytics Dashboard',
      description: 'Real-time analytics dashboard with interactive visualizations',
      technologies: ['Python', 'Django', 'D3.js', 'PostgreSQL'],
      github: '#',
      live: '#'
    }
  ];

  return (
    <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                SM
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Sumit Kumar Mallick
              </h1>
              <p className="text-xl text-gray-600 mb-4">
                Senior Software Engineer & Full Stack Developer
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                  📍 Location
                </div>
                <div className="flex items-center">
                  🗓️ 5+ Years Experience
                </div>
              </div>

              {/* Social Links */}
              <div className="flex justify-center md:justify-start space-x-4">
                <a
                  href="https://www.linkedin.com/in/sumitkumarmallick/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  LinkedIn
                </a>
                <a
                  href="https://github.com/sumitmallick"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
                >
                  GitHub
                </a>
                <a
                  href="mailto:contact@sumitkumar.dev"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Email
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Me</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Passionate Full Stack Developer with 5+ years of experience building scalable web applications 
            and leading development teams. I specialize in modern JavaScript frameworks, backend API development, 
            and cloud infrastructure. My expertise spans from frontend user experience to backend architecture 
            and database optimization.
          </p>
          <p className="text-gray-700 leading-relaxed">
            I'm dedicated to writing clean, maintainable code and staying current with emerging technologies. 
            I enjoy solving complex problems, mentoring fellow developers, and contributing to open-source projects. 
            Currently focused on building innovative solutions that make a positive impact.
          </p>
        </div>

        {/* Skills Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            💻 Technical Skills
          </h2>
          <div className="flex flex-wrap gap-3">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Experience Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            💼 Professional Experience
          </h2>
          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <div key={index} className="border-l-4 border-indigo-500 pl-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{exp.title}</h3>
                  <span className="text-sm text-gray-500">{exp.duration}</span>
                </div>
                <p className="text-indigo-600 font-medium mb-1">{exp.company}</p>
                <p className="text-gray-500 text-sm mb-3">{exp.location}</p>
                <ul className="list-disc list-inside space-y-1">
                  {exp.description.map((item, idx) => (
                    <li key={idx} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Education Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🎓 Education
          </h2>
          <div className="space-y-6">
            {education.map((edu, index) => (
              <div key={index} className="border-l-4 border-green-500 pl-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{edu.degree}</h3>
                  <span className="text-sm text-gray-500">{edu.duration}</span>
                </div>
                <p className="text-green-600 font-medium mb-1">{edu.institution}</p>
                <p className="text-gray-700">{edu.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Projects Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🏆 Featured Projects
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {projects.map((project, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
                <p className="text-gray-600 mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex space-x-4">
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                    >
                      📋 Code
                    </a>
                  )}
                  {project.live && (
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 transition-colors text-sm font-medium"
                    >
                      🔗 Live Demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Let's Connect</h2>
          
          {/* Get In Touch Form */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">📧 Get In Touch</h3>
            <p className="text-gray-600 mb-4">
              Have a project in mind? Want to collaborate? Or just want to say hello? I'd love to hear from you!
            </p>
            <form className="space-y-4" action="mailto:contact@sumitkumar.dev" method="post" encType="text/plain">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="What's this about?"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Tell me about your project or just say hello!"
                  required
                ></textarea>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button type="submit" className="flex-1">
                  Send Message 📨
                </Button>
                <Button type="button" variant="outline" asChild className="flex-1">
                  <a href="mailto:contact@sumitkumar.dev">
                    Quick Email 💬
                  </a>
                </Button>
              </div>
            </form>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-8"></div>

          {/* Buy Me a Coffee */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">☕ Support My Work</h3>
            <p className="text-gray-600 mb-6">
              If you found my projects helpful or just want to support my open-source work, 
              consider buying me a coffee! It helps keep me caffeinated while coding. 😊
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
              <Button asChild className="bg-yellow-500 hover:bg-yellow-600 text-white">
                <a 
                  href="https://www.buymeacoffee.com/sumitkumar" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                >
                  ☕ Buy Me a Coffee
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a 
                  href="https://github.com/sponsors/sumitmallick" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                >
                  � GitHub Sponsor
                </a>
              </Button>
            </div>
            
            {/* Coffee Stats */}
            <div className="bg-gray-50 rounded-lg p-4 inline-block">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">127</div>
                  <div>Cups of Coffee</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">42</div>
                  <div>Projects Completed</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">∞</div>
                  <div>Lines of Code</div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Contact Methods */}
          <div className="border-t border-gray-200 mt-8 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Other Ways to Connect</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <a
                href="https://www.linkedin.com/in/sumitkumarmallick/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="text-2xl mb-2">💼</div>
                <span className="text-sm font-medium text-blue-700">LinkedIn</span>
              </a>
              <a
                href="https://github.com/sumitmallick"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="text-2xl mb-2">🐙</div>
                <span className="text-sm font-medium text-gray-700">GitHub</span>
              </a>
              <a
                href="https://twitter.com/iamskmallick"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-4 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors"
              >
                <div className="text-2xl mb-2">🐦</div>
                <span className="text-sm font-medium text-sky-700">Twitter</span>
              </a>
              <a
                href="mailto:mallicksumit546@gmail.com"
                className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="text-2xl mb-2">📧</div>
                <span className="text-sm font-medium text-red-700">Email</span>
              </a>
              <a
                href="tel:+917063760250"
                className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="text-2xl mb-2">📞</div>
                <span className="text-sm font-medium text-green-700">Call Me</span>
              </a>
              <a
                href="https://wa.me/917063760250"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <div className="text-2xl mb-2">💬</div>
                <span className="text-sm font-medium text-emerald-700">WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Thank You Note */}
          {isAuthenticated && (
            <div className="mt-8 p-4 bg-indigo-50 rounded-lg text-center">
              <p className="text-indigo-800">
                Thanks for checking out WhisperVault! 🎉 Feel free to{' '}
                <Link href="/submit" className="font-semibold underline hover:text-indigo-900">
                  share your thoughts
                </Link>{' '}
                on the platform.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}