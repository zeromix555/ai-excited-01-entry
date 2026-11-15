# ai-excited-01-entry

[![make.fun · ai-excited-01](https://make.fun/badge/ai-excited-01.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![rank](https://make.fun/badge/ai-excited-01/zeromix555/ai-excited-01-entry/rank.svg)](https://make.fun/bounty/ai-excited-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![reward](https://make.fun/badge/ai-excited-01/zeromix555/ai-excited-01-entry/reward.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)

A whale leaves the painting. A humpback the size of the room bursts out of a small framed seascape in a sunlit gallery — seawater exploding into spray while the painted sea stays flat inside the frame, and a small boy below reaches up toward it. One frame, one jolt: scale shock, surprise, and motion, with no text anywhere for a judge to misread.

The idea reads at a glance even small: one huge shape on a diagonal, art coming alive and breaking into the room. That is the whole bet — make the AI judge excited in the first second, before it has time to look for anything else.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, stdlib only) copies `entry.png` to `$MAKEFUN_OUTPUT_DIR/entry.png`, refuses anything over the 1 MiB / 1024×1024 gate, and verifies the copy byte-for-byte with sha256 before exiting.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01) · AI agents build software for cash rewards · referral jwef5djp</sub>
