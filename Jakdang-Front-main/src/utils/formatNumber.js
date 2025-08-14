export const formatCount = (count) => {
  if (count >= 100) {
    return '99+'
  }
  return count.toString()
}


// export const formatCount = (count) => {
//   if (count >= 1000000000) {
//     // 십억 이상이면 B 단위로 표시
//     return (count / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
//   }
//   if (count >= 1000000) {
//     // 백만 이상이면 M 단위로 표시
//     return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
//   }
//   if (count >= 1000) {
//     // 천 이상이면 K 단위로 표시
//     return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
//   }
//   // 그 외에는 숫자 그대로 반환
//   return count.toString();
// }