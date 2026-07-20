import { describe, expect, it } from "vitest";
import { cents, formatZar } from "@/modules/shared/domain/money";

describe("money", () => {
  it("rejects fractional cents", () => {
    expect(() => cents(10.5)).toThrow(/safe integer/);
  });

  it("formats South African rand", () => {
    expect(formatZar(cents(148_260))).toContain("1 482,60");
  });
});
