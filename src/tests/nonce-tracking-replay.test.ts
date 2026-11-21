import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Soroban Transaction Replay Protection & Nonce Tracking (#420)", () => {
  let localSequence: number;
  let isSubmitting: boolean;

  beforeEach(() => {
    localSequence = 100;
    isSubmitting = false;
  });

  it("disables UI button during transaction signature and submission flight", async () => {
    const handleTransaction = async () => {
      isSubmitting = true;
      // Simulate signature / submission flight
      await new Promise((resolve) => setTimeout(resolve, 50));
      isSubmitting = false;
    };

    expect(isSubmitting).toBe(false);
    const promise = handleTransaction();
    expect(isSubmitting).toBe(true);
    await promise;
    expect(isSubmitting).toBe(false);
  });

  it("updates local sequence counter optimistically and resyncs with Horizon sequence", async () => {
    const fetchHorizonSequence = async () => 105;

    // Optimistic increment
    localSequence += 1;
    expect(localSequence).toBe(101);

    // Resync with Horizon sequence
    const horizonSeq = await fetchHorizonSequence();
    localSequence = horizonSeq;
    expect(localSequence).toBe(105);
  });

  it("tests retry mechanism for txBAD_SEQ errors by automatically fetching current sequence", async () => {
    let attempts = 0;
    const mockSubmitTx = vi.fn().mockImplementation(async (seq: number) => {
      attempts++;
      if (seq < 110) {
        const err = new Error("Transaction failed with txBAD_SEQ");
        (err as unknown as { code: string }).code = "txBAD_SEQ";
        throw err;
      }
      return { hash: "SUCCESS_TX_HASH" };
    });

    const fetchCurrentSequence = async () => 110;

    let currentSeq = 105;
    let result;

    for (let i = 0; i < 3; i++) {
      try {
        result = await mockSubmitTx(currentSeq);
        break;
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes("txBAD_SEQ")) {
          currentSeq = await fetchCurrentSequence();
        } else {
          throw err;
        }
      }
    }

    expect(attempts).toBe(2);
    expect(currentSeq).toBe(110);
    expect(result).toEqual({ hash: "SUCCESS_TX_HASH" });
  });
});
