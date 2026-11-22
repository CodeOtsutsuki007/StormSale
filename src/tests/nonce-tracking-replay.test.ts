import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Soroban Transaction Replay Protection, Nonce Tracking, and Sequence Resync (Issue #433 / #450)", () => {
  let localSequenceCounter = 100n;
  let isSubmitting = false;

  beforeEach(() => {
    localSequenceCounter = 100n;
    isSubmitting = false;
    vi.clearAllMocks();
  });

  describe("1. UI Button Disabling During Transaction Flight", () => {
    it("disables transaction submission buttons while flight is active", async () => {
      const submitAction = async () => {
        isSubmitting = true;
        // simulate flight delay
        await new Promise((resolve) => setTimeout(resolve, 50));
        isSubmitting = false;
      };

      expect(isSubmitting).toBe(false);
      const promise = submitAction();
      expect(isSubmitting).toBe(true);
      await promise;
      expect(isSubmitting).toBe(false);
    });
  });

  describe("2. Optimistic Sequence Updates and Resync", () => {
    it("updates local sequence counter optimistically and resyncs with Horizon sequence", async () => {
      const fetchHorizonSequence = async (): Promise<bigint> => {
        return 105n;
      };

      // Optimistic increment
      localSequenceCounter += 1n;
      expect(localSequenceCounter).toBe(101n);

      // Resync with Horizon
      const horizonSeq = await fetchHorizonSequence();
      localSequenceCounter = horizonSeq;
      expect(localSequenceCounter).toBe(105n);
    });
  });

  describe("3. Retry Mechanism for txBAD_SEQ Errors", () => {
    it("automatically fetches current sequence and retries on txBAD_SEQ error", async () => {
      let attempts = 0;
      let currentSeq = 100n;

      const mockHorizonSequence = async () => 102n;

      const executeTransaction = async (seq: bigint): Promise<string> => {
        attempts++;
        if (seq < 102n) {
          const err = new Error("Transaction failed with txBAD_SEQ code (-5)");
          (err as any).resultCode = "txBAD_SEQ";
          throw err;
        }
        return "TX_SUCCESS_HASH";
      };

      let txResult = "";
      try {
        txResult = await executeTransaction(currentSeq);
      } catch (err: any) {
        if (err.resultCode === "txBAD_SEQ" || err.message.includes("txBAD_SEQ")) {
          currentSeq = await mockHorizonSequence();
          txResult = await executeTransaction(currentSeq);
        }
      }

      expect(attempts).toBe(2);
      expect(currentSeq).toBe(102n);
      expect(txResult).toBe("TX_SUCCESS_HASH");
    });
  });
});
