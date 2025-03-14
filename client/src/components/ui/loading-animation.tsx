import React from "react";
import { motion } from "framer-motion";

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
}

export function LoadingDots() {
  return (
    <div className="flex space-x-2 justify-center items-center">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-3 h-3 bg-primary rounded-full"
          animate={{
            scale: [0, 1, 0]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2
          }}
        />
      ))}
    </div>
  );
}

export function AnimatedProgressBar({ progress, showPercentage = true }: { progress: number; showPercentage?: boolean }) {
  return (
    <div className="w-full">
      <div className="h-4 bg-secondary/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          style={{ width: `${progress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      {showPercentage && (
        <div className="text-sm text-center mt-2 text-muted-foreground">
          {Math.round(progress)}% Complete
        </div>
      )}
    </div>
  );
}

export function ExamProgress({ 
  currentQuestion, 
  totalQuestions, 
  timeProgress 
}: { 
  currentQuestion: number; 
  totalQuestions: number; 
  timeProgress: number; 
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question Progress</span>
          <span>{currentQuestion} of {totalQuestions}</span>
        </div>
        <AnimatedProgressBar 
          progress={(currentQuestion / totalQuestions) * 100} 
          showPercentage={false}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Time Remaining</span>
          <span>{Math.round(timeProgress)}%</span>
        </div>
        <AnimatedProgressBar 
          progress={timeProgress} 
          showPercentage={false}
        />
      </div>
    </div>
  );
}