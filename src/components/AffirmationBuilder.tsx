import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Play } from "lucide-react";
import { toast } from "sonner";

const categories = ["Wealth", "Love", "Health", "Success", "Confidence", "Gratitude"];

export const AffirmationBuilder = () => {
  const [affirmations, setAffirmations] = useState<Array<{ text: string; category: string }>>([
    { text: "I am worthy of abundance and success", category: "Wealth" },
    { text: "I attract positive opportunities effortlessly", category: "Success" },
  ]);
  const [newAffirmation, setNewAffirmation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Wealth");

  const addAffirmation = () => {
    if (!newAffirmation.trim()) {
      toast.error("Please enter an affirmation");
      return;
    }
    setAffirmations([...affirmations, { text: newAffirmation, category: selectedCategory }]);
    setNewAffirmation("");
    toast.success("Affirmation added!");
  };

  const removeAffirmation = (index: number) => {
    setAffirmations(affirmations.filter((_, i) => i !== index));
    toast.success("Affirmation removed");
  };

  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Build Your Affirmations
          </h2>
          <p className="text-lg text-muted-foreground">
            Create personalized affirmations organized by category and intention
          </p>
        </div>

        <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/20">
          {/* Category Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block text-foreground">
              Select Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedCategory === cat 
                      ? "bg-gradient-primary shadow-glow-primary" 
                      : "hover:border-primary/40"
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* Add New Affirmation */}
          <div className="mb-8">
            <label className="text-sm font-medium mb-3 block text-foreground">
              Create Affirmation
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="I am worthy of..."
                value={newAffirmation}
                onChange={(e) => setNewAffirmation(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addAffirmation()}
                className="bg-background/50 border-primary/20 focus:border-primary"
              />
              <Button 
                onClick={addAffirmation}
                className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Affirmation List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-foreground">
                Your Affirmations ({affirmations.length})
              </label>
              <Button 
                size="sm" 
                variant="outline"
                className="border-secondary/30 hover:bg-secondary/10"
              >
                <Play className="w-4 h-4 mr-2" />
                Play Sequence
              </Button>
            </div>
            
            {affirmations.map((affirmation, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-primary/10 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="flex-1">
                  <p className="text-foreground mb-1">{affirmation.text}</p>
                  <Badge variant="outline" className="text-xs border-primary/30">
                    {affirmation.category}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAffirmation(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
};
