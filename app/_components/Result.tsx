import { RotateCw } from "lucide-react";
import { motion } from "motion/react";
export const Results = ({
  wpm,
  accuracy,
  onRestart,
}: {
  wpm: number;
  accuracy: number;
  onRestart: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center w-full  bg-blue-300 gap-6 p-8  r"
    >
      <h2 className="text-3xl font-bold text-yellow-400">Test Complete!</h2>
      <div className="flex gap-12">
        <div className="text-center">
          <div className="text-5xl font-bold ">{wpm}</div>
          <div className="text-gray-400 text-2xl mt-2">WPM</div>
        </div>
        <div className="text-center">
          <div className="text-5xl font-bold ">{accuracy}%</div>
          <div className="text-gray-400 text-2xl mt-2">Accuracy</div>
        </div>
      </div>
      <button
        onClick={onRestart}
        className="px-6 py-3  text-gray-900 font-semibold rounded-lg  transition-colors"
      >
        <RotateCw />
      </button>
    </motion.div>
  );
};
