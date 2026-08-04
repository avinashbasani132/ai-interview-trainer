async function renderArena() {
    setActiveNav('arena');
    showLoader();
    const container = document.getElementById('app-container');

    // Fetch daily DSA problem
    let problem = { 
        title: 'Two Sum', 
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', 
        difficulty: 'Easy', 
        example_input: '[2,7,11,15], target = 9', 
        example_output: '[0,1]' 
    };
    try {
        const res = await fetch(`${API_BASE}/dsa/daily`);
        if (res.ok) { 
            const d = await parseJSON(res); 
            if (d && d.title) problem = d; 
        }
    } catch(_) {}

    const diffColor = problem.difficulty === 'Hard' ? 'text-red-400' : (problem.difficulty === 'Medium' ? 'text-yellow-400' : 'text-green-400');
    const problemTitle = problem.title;
    const problemDifficulty = problem.difficulty;
    const problemDescription = problem.description;

    let problemExampleHtml = '';
    if (problem.example_input) {
        problemExampleHtml = `
        <div class="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Example</p>
            <p class="text-xs text-slate-300 font-mono mb-1"><span class="text-slate-500">Input:</span> ${problem.example_input}</p>
            <p class="text-xs text-slate-300 font-mono"><span class="text-slate-500">Output:</span> ${problem.example_output || ''}</p>
        </div>`;
    }

    container.innerHTML = renderTemplate('template-coding', {
        problemTitle,
        diffColor,
        problemDifficulty,
        problemDescription,
        problemExampleHtml
    });

    // Initialize Monaco Editor
    initMonaco();
}

function initMonaco() {
    if (typeof require === 'undefined') { 
        document.getElementById('monaco-editor-container').innerHTML = '<p class="text-slate-400 text-sm p-4">Monaco editor loading...</p>'; 
        return; 
    }
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.41.0/min/vs' } });
    require(['vs/editor/editor.main'], function () {
        if (monacoEditor) { monacoEditor.dispose(); monacoEditor = null; }
        monacoEditor = monaco.editor.create(document.getElementById('monaco-editor-container'), {
            value: getStarterCode('python'),
            language: 'python',
            theme: 'vs-dark',
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fontFamily: '"Fira Code", "Cascadia Code", monospace',
            fontLigatures: true,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            tabSize: 4,
        });

        const langSelect = document.getElementById('lang-select');
        if (langSelect) {
            langSelect.addEventListener('change', (e) => {
                const lang = e.target.value;
                const monacoLang = lang === 'c++' ? 'cpp' : lang === 'javascript' ? 'javascript' : lang;
                monaco.editor.setModelLanguage(monacoEditor.getModel(), monacoLang);
                monacoEditor.setValue(getStarterCode(lang));
                const label = document.getElementById('editor-file-label');
                if (label) {
                    const ext = lang === 'python' ? 'py' : lang === 'javascript' ? 'js' : lang === 'java' ? 'java' : 'cpp';
                    label.textContent = `solution.${ext}`;
                }
            });
        }
    });
}

function getStarterCode(lang) {
    const starters = {
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
    return starters[lang] || starters.python;
}

async function runCode() {
    const btn = document.getElementById('run-btn');
    const output = document.getElementById('code-output');
    const status = document.getElementById('run-status');
    const lang = document.getElementById('lang-select').value;
    const code = monacoEditor ? monacoEditor.getValue() : '';

    if (!code.trim()) { showToast('Please write some code first!', 'warning'); return; }

    btn.disabled = true;
    btn.innerHTML = `<div class="loader" style="width:16px;height:16px;border-width:2px;"></div> Running...`;
    output.textContent = '⏳ Executing...';
    status.textContent = 'Running...';

    try {
        const res = await fetch(`${API_BASE}/code/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ code, language: lang })
        });
        const data = await parseJSON(res);
        output.textContent = data.output || data.error || 'No output';
        output.className = `bg-black/60 border border-slate-700 rounded-lg p-3 font-mono text-xs min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap ${data.error ? 'text-red-400' : 'text-green-400'}`;
        status.textContent = data.error ? '❌ Error' : '✅ Ran successfully';
        showToast(data.error ? 'Runtime error — check output.' : 'Code executed!', data.error ? 'error' : 'success');
    } catch (err) {
        output.textContent = `Error: ${err.message}`;
        output.className = `bg-black/60 border border-red-700/50 rounded-lg p-3 font-mono text-xs text-red-400 min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap`;
        status.textContent = '❌ Failed';
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Run Code`;
    }
}
