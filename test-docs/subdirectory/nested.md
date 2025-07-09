# Nested Documentation

This file is in a subdirectory to test directory navigation.

## Directory Structure

```
test-docs/
├── index.md
├── sample.html
├── example.js
└── subdirectory/
    └── nested.md (this file)
```

## Navigation

- Use the breadcrumb navigation at the top
- Click the back button to return to the parent directory
- The server prevents navigation above the root directory

## Python Example

```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quicksort(left) + middle + quicksort(right)

# Example usage
numbers = [3, 6, 8, 10, 1, 2, 1]
sorted_numbers = quicksort(numbers)
print(sorted_numbers)
```