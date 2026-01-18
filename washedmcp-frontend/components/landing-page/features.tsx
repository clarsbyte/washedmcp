import { Layers, Zap, Shield, BarChart3 } from "lucide-react"

const features = [
  {
    name: "Automated Workflows",
    description: "Build complex automation workflows with our intuitive drag-and-drop builder. No coding required.",
    icon: Zap,
  },
  {
    name: "Seamless Integrations",
    description: "Connect with 200+ apps and services. Sync data across your entire tech stack effortlessly.",
    icon: Layers,
  },
  {
    name: "Enterprise Security",
    description: "Bank-grade encryption, SSO, and compliance certifications. Your data is always protected.",
    icon: Shield,
  },
  {
    name: "Real-time Analytics",
    description: "Monitor workflow performance with detailed analytics. Optimize and improve continuously.",
    icon: BarChart3,
  },
]

export function Features() {
  return (
    <section id="features" className="px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Features</p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Faster iteration. More innovation.
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            The platform for rapid progress. Let your team focus on shipping features instead of managing
            infrastructure.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <feature.icon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">{feature.name}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
