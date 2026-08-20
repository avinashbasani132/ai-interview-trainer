import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Editor from '@monaco-editor/react';
import { Trophy, Play, Terminal } from 'lucide-react';


const STARTER_CODES = {
  python: `def solution(nums, target):
    # Write your solution here
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test
print(solution([2, 7, 11, 15], 9))`,
  javascript: `function solution(nums, target) {
    // Write your solution here
    const seen = {};
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (complement in seen) return [seen[complement], i];
        seen[nums[i]] = i;
    }
    return [];
}

console.log(solution([2, 7, 11, 15], 9));`,
  java: `import java.util.*;
public class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) return new int[]{map.get(complement), i};
            map.put(nums[i], i);
        }
        return new int[]{};
    }
    public static void main(String[] args) {
        Solution s = new Solution();
        System.out.println(Arrays.toString(s.twoSum(new int[]{2,7,11,15}, 9)));
    }
}`,
  'c++': `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;
vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int,int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int comp = target - nums[i];
        if (seen.count(comp)) return {seen[comp], i};
        seen[nums[i]] = i;
    }
    return {};
}
int main() {
    vector<int> nums = {2, 7, 11, 15};
    auto res = twoSum(nums, 9);
    cout << "[" << res[0] << "," << res[1] << "]" << endl;
}`
};

export default function Arena() {
  const [problem, setProblem] = useState({
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    difficulty: 'Easy',
    example_input: '[2,7,11,15], target = 9',
    example_output: '[0,1]'
  });
  
  const [language, setLanguage] = useState('python');
  const [codeValue, setCodeValue] = useState(STARTER_CODES.python);
  const [output, setOutput] = useState('Output appears here...');
  const [outputColor, setOutputColor] = useState('text-green-400');
  const [status, setStatus] = useState('Idle');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    loadDailyDSA();
  }, []);

  const loadDailyDSA = async () => {
    try {
      const data = await api.getDailyDSA();
      if (data && data.title) {
        setProblem(data);
      }
    } catch (e) {
      console.error('Failed to load daily DSA:', e);
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCodeValue(STARTER_CODES[lang] || '');
  };

  const executeCode = async () => {
    if (!codeValue.trim()) return;
    setRunning(true);
    setOutput('⏳ Executing test cases...');
    setOutputColor('text-amber-400');
    setStatus('Running...');

    try {
      const res = await api.submitDSASolution(problem.id || '1', codeValue);
      setOutput(res.output || 'No output recorded.');
      if (res.error) {
        setOutputColor('text-red-400');
        setStatus('Error');
      } else {
        setOutputColor('text-green-400');
        setStatus('Success');
      }
    } catch (err) {
      setOutput(`Execution error: ${err.message}`);
      setOutputColor('text-red-400');
      setStatus('Failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white font-outfit">Coding Arena</h2>
          <p className="text-slate-400 mt-1 text-sm">Practice algorithms, run logic edge-cases, and test solutions in real time.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="c++">C++</option>
          </select>

          <button 
            disabled={running}
            onClick={executeCode}
            className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-green-600/20 flex items-center gap-1 disabled:opacity-40"
          >
            <Play className="w-4.5 h-4.5 fill-white" />
            {running ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Problem Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-indigo-400" />
              {problem.title}
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full bg-slate-850 border border-slate-800 font-bold ${
              problem.difficulty === 'Hard' ? 'text-red-400' : problem.difficulty === 'Medium' ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {problem.difficulty}
            </span>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed">{problem.description}</p>

          {problem.example_input && (
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 font-mono text-xs space-y-1.5">
              <p className="text-slate-500">Input: <span className="text-slate-200">{problem.example_input}</span></p>
              <p className="text-slate-500">Output: <span className="text-slate-200">{problem.example_output}</span></p>
            </div>
          )}
        </div>

        {/* Right Panel: Editor & Output */}
        <div className="space-y-4">
          {/* Editor Container */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 h-[300px]">
            <Editor 
              height="300px"
              language={language === 'c++' ? 'cpp' : language}
              value={codeValue}
              theme="vs-dark"
              onChange={(val) => setCodeValue(val)}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4
              }}
            />
          </div>

          {/* Terminal Console */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold border-b border-slate-900 pb-2">
              <span className="flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5" />
                Execution Console
              </span>
              <span>Status: {status}</span>
            </div>
            <pre className={`font-mono text-xs whitespace-pre-wrap ${outputColor} min-h-[60px] max-h-[140px] overflow-y-auto`}>
              {output}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
