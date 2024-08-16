export function excelCoord(i: number, j: number) {
  let col = excelCol(j);
  return `${col}${i+1}`;
}

export function excelCol(i: number) {
  i++;
  let ret = [];
  while (i) {
    ret.push(String.fromCharCode('A'.charCodeAt(0) + (i - 1) % 26));
    i = Math.floor((i - 1)/26);
  }
  ret.reverse();
  return ret.join('');
}

export function bisect(nums: number[], v: number) {
  let lo = 0, hi = nums.length;
  while (lo < hi) {
    let mid = Math.floor((lo + hi) / 2);
    if (v >= nums[mid]) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}