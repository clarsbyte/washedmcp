def check_reverse(s: str) -> bool:
    """Check if string is palindrome"""
    return s == s[::-1]


def calculate_fibonacci(n: int) -> int:
    """Calculate nth fibonacci number"""
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)


def merge_sorted_arrays(arr1: list, arr2: list) -> list:
    """Merge two sorted arrays into one sorted array"""
    result = []
    i = j = 0
    while i < len(arr1) and j < len(arr2):
        if arr1[i] < arr2[j]:
            result.append(arr1[i])
            i += 1
        else:
            result.append(arr2[j])
            j += 1
    result.extend(arr1[i:])
    result.extend(arr2[j:])
    return result


def binary_search(arr: list, target: int) -> int:
    """Find target in sorted array, return index or -1"""
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
