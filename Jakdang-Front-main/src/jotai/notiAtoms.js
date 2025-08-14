import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const notiListAtom = atom([]);
export const hasNewNotiAtom = atom(false);
export const notiCountAtom = atomWithStorage('noti-counts', {});

export const setNotiCountAtom = atom(null, (get, set, count) => {
  set(notiCountAtom, count);
});