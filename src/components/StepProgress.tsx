import { Check } from 'lucide-react';
import { WizardStep } from '../types';

interface StepProgressProps {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
}

const STEPS = [
  { step: 1, label: 'Live Demos', short: '1' },
  { step: 2, label: 'Brand Guarantee', short: '2' },
  { step: 3, label: 'Free Training', short: '3' },
  { step: 4, label: 'Transparent Pricing', short: '4' },
] as const;

export default function StepProgress({ currentStep, onStepClick }: StepProgressProps) {
  if (currentStep > 4) return null;

  return (
    <nav aria-label="Onboarding Steps" className="w-full flex justify-center mb-6 sm:mb-8">
      <div 
        id="wizard-step-progress"
        className="inline-flex items-center gap-1 sm:gap-1.5 p-1.5 bg-[#FFFFFF]/90 backdrop-blur-md rounded-2xl border border-[#E7E0D6] shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
      >
        <span className="text-[11px] font-semibold text-[#7A6A66] pl-2.5 pr-1.5 hidden sm:inline tabular-nums">
          Step {currentStep} of 4
        </span>

        <div className="h-4 w-px bg-[#E7E0D6] hidden sm:block mx-1" />

        {STEPS.map((s) => {
          const isActive = currentStep === s.step;
          const isCompleted = currentStep > s.step;

          return (
            <button
              key={s.step}
              onClick={() => onStepClick(s.step as WizardStep)}
              id={`step-indicator-${s.step}`}
              className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer focus:outline-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-[#DC2626] to-[#7C3AED] text-white shadow-[0_2px_10px_rgba(220,38,38,0.3)]'
                  : isCompleted
                  ? 'text-[#DC2626] hover:bg-[#DC2626]/10'
                  : 'text-[#7A6A66] hover:text-[#1C1614] hover:bg-[#DC2626]/5'
              }`}
              title={`Step ${s.step}: ${s.label}`}
            >
              <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold transition-colors ${
                isActive
                  ? 'bg-white text-[#DC2626]'
                  : isCompleted
                  ? 'bg-[#DC2626] text-white'
                  : 'bg-[#DC2626]/10 text-[#DC2626]'
              }`}>
                {isCompleted ? <Check className="w-3 h-3 stroke-[2.5]" /> : s.short}
              </span>
              <span className="whitespace-nowrap">{s.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
