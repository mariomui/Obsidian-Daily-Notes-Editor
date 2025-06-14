import { setNested } from 'rollphidian';
import { beforeEach, describe, expect, it, vitest } from 'vitest';
// import util from "util";

describe("setNested function", () => {
    const originalObject = {
        foo: "bar",
        count: 0,
        nested: {
            key: "value",
        },
    };
    let myObject = structuredClone(originalObject);
    const advancedObject = {
        a: {
            b: {
                c: {
                    d: "x",
                },
            },
        },
    };
    beforeEach(() => {
        vitest.resetModules();

        console.clear(); // clears the terminal output before each test

        myObject = structuredClone(originalObject);
    });
    it("should set the key", () => {
        setNested(myObject, "nested.key", "test");
        expect(myObject).toEqual({
            foo: "bar",
            count: 0,
            nested: { key: "test" },
        });
        setNested(myObject, "nested.key", "red");

        expect(myObject).toEqual({
            foo: "bar",
            count: 0,
            nested: { key: "red" },
        });
    });
    describe("how it should fail when nesting a existing key that that is not an object", () => {
        it.fails(
            "should fail when nesting inside a existing key that is not an object. (simple)",
            () => {
                setNested(myObject, "count.fount", []);
                expect(myObject?.count?.fount).toEqual([]);
                expect(myObject).toEqual(originalObject);
            }
        );
    });
    describe("how it should fail when nesting a existing key that that is not an object (highly nested)", () => {
        beforeEach(() => {
            setNested(myObject, "count.fount.piss", []);
        });
        it("should fail", () => {
            expect(myObject?.count?.fount?.piss).not.toEqual([]);
        });
        it("should be unchanged", () => {
            expect(myObject).toEqual(originalObject);
        });
    });

    it("should set if key is object.", () => {
        setNested(myObject, "nested.key", []);

        expect(myObject?.nested?.key).toEqual([]);
    });
    it("should set non existent properties if super nested", () => {
        setNested(myObject, "a.b.c.d", "supernested");
        expect(myObject.a.b.c.d).toBe("supernested");
    });

    it("should fail gracefully", () => {
        expect(() => setNested("kjk", "a.b.c.d", "supernested")).toThrow();
        expect(() => setNested({}, "a.b.c.d", "supernested")).not.toThrow();
    });
    it("should fail on deeply nested property even when all the prev. props exist", () => {
        setNested(advancedObject, "a.b.c.d.x", "r");
        expect(advancedObject.a.b.c.d).toBe("x");
        expect(advancedObject.a.b.c.d.x).toEqual(undefined);
    });

    it("shoudl fail only set on the 10th but not the 11th", () => {
        const temp = {};

        setNested(temp, "a1.a2.a3.a4.a5.a6.a7.a8.a9.a10", "red");
        expect(temp.a1.a2.a3.a4.a5.a6.a7.a8.a9.a10).toEqual("red");

        expect(() => {
            setNested(temp, "b1.b2.b3.b4.b5.b6.b7.b8.b9.b10.b11", "blue", 10);
        }).toThrowError("recursion over limit");

        expect(() => {
            const tempB = {};
            setNested(tempB, "b1.b2.b3.b4.b5.b6.b7.b8.b9.b10", "blue", 9);
        }).toThrowError("recursion over limit");
        //vilog(temp);
    });
});

function vilog(...args) {
    console.log(util.inspect(...args, { depth: null, colors: true }));
}
