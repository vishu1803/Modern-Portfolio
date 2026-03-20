"use client";

/**
 * ProjectsScene — 3 floating project cards with title, description,
 * tech stack, and link buttons.
 *
 * Visibility is controlled entirely by the master GSAP timeline
 * in page.tsx; this component is purely presentational with
 * CSS-only hover interactions.
 */

const PROJECTS = [
  {
    title: "Project Alpha",
    description:
      "A real-time collaborative platform with WebSocket-driven state sync and optimistic UI updates.",
    tech: ["Next.js", "TypeScript", "Redis", "WebSocket"],
    liveUrl: "#",
    sourceUrl: "#",
  },
  {
    title: "Project Beta",
    description:
      "REST API gateway handling 10k+ requests/sec with rate limiting, caching, and JWT auth.",
    tech: ["Python", "FastAPI", "PostgreSQL", "Docker"],
    liveUrl: "#",
    sourceUrl: "#",
  },
  {
    title: "Project Gamma",
    description:
      "CLI tool for automated code review with custom linting rules and Git hook integration.",
    tech: ["Go", "Git", "CI/CD", "Bash"],
    liveUrl: "#",
    sourceUrl: "#",
  },
];

export default function ProjectsScene() {
  return (
    <div className="w-full flex flex-col items-center justify-center px-6 relative z-10">
      <div className="max-w-6xl w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PROJECTS.map((project) => (
            <div
              key={project.title}
              className="project-card group relative rounded-[1.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-md p-8 flex flex-col justify-between transition-all duration-500 ease-out hover:border-white/25 hover:bg-white/[0.06] hover:shadow-[0_0_40px_rgba(102,245,255,0.08)] hover:-translate-y-2"
              style={{ perspective: "800px" }}
            >
              {/* Subtle corner glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 rounded-full blur-2xl -z-10 transform translate-x-1/3 -translate-y-1/3 group-hover:bg-cyan-400/10 transition-colors duration-500" />

              <div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors duration-300">
                  {project.title}
                </h3>
                <p className="text-gray-400 text-base leading-relaxed mb-6">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="text-xs font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={project.liveUrl}
                  className="px-5 py-2.5 text-sm font-semibold rounded-full bg-white text-black hover:bg-gray-200 transition-colors"
                >
                  Live
                </a>
                <a
                  href={project.sourceUrl}
                  className="px-5 py-2.5 text-sm font-semibold rounded-full bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
                >
                  Source
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
