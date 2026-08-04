import datetime

DSA_PROBLEMS = [
    {
        "title": "Two Sum",
        "difficulty": "Easy",
        "description": "Given an array of integers return indices of the two numbers that add up to a target."
    },
    {
        "title": "Reverse Linked List",
        "difficulty": "Easy",
        "description": "Reverse a singly linked list."
    },
    {
        "title": "Longest Substring Without Repeating Characters",
        "difficulty": "Medium",
        "description": "Find the length of the longest substring without repeating characters."
    },
    {
        "title": "Binary Search",
        "difficulty": "Easy",
        "description": "Implement binary search on a sorted array."
    }
]

def get_daily_problem():
    day = datetime.datetime.now().day
    index = day % len(DSA_PROBLEMS)
    return DSA_PROBLEMS[index]