import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles } from "lucide-react";
import mirrorMode from "@/assets/mirror-mode.jpg";

export const MirrorMode = () => {
  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-secondary/20 mb-6">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-sm text-muted-foreground">Transform Through Reflection</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-secondary bg-clip-text text-transparent">
              Mirror Work
            </h2>
            
            <p className="text-lg text-muted-foreground mb-6">
              Activate your front-facing camera while affirmations flash across your screen. 
              See yourself receiving your desires in real-time.
            </p>
            
            <p className="text-foreground/80 mb-8">
              This powerful technique combines Mirror Work with spaced repetition, 
              creating deeper neural pathways for belief transformation. Watch as your 
              subconscious accepts these truths while you witness your own transformation.
            </p>
            
            <Button 
              size="lg"
              className="bg-gradient-secondary hover:shadow-glow-secondary transition-all duration-300"
            >
              <Camera className="w-5 h-5 mr-2" />
              Try Mirror Work
            </Button>
          </div>
          
          <Card className="relative overflow-hidden border-secondary/20 bg-card/50 backdrop-blur-sm">
            <img 
              src={mirrorMode} 
              alt="Mirror Work visualization" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="space-y-2">
                <div className="text-2xl font-semibold text-foreground animate-pulse">
                  I am successful
                </div>
                <div className="text-xl text-foreground/70">
                  I attract abundance effortlessly
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
