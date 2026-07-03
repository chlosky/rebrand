import { Card } from "@/components/ui/card";
import { dashboardFeatures } from "@/lib/featuresData";

export const Features = () => {
  return (
    <section className="py-12 px-4 sm:px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-foreground">
            Your Growth Toolkit
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Strengthen your self-concept and build lasting change
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {dashboardFeatures.map((feature) => (
            <Card 
              key={feature.path}
              className="p-3 sm:p-4 border-2 border-border transition-all duration-300 hover:scale-[1.02]"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold mb-1 text-foreground leading-tight">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-tight line-clamp-2">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
