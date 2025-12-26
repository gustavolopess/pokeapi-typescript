type NamedApiResource<T> = {
	name: string;
	url: string;
};

type NamedApiResourceList<T> = {
	count: number;
	next: string;
	previous: string;
	results: T[];
};

// Dummy type for the generic parameter T
type DummyItem = {
    id: number;
    info: string;
};

describe('Utility Type Definitions', () => {

    // --- Testing NamedApiResource<T> ---
    describe('NamedApiResource<T>', () => {
        it('should correctly define the structure for a simple resource', () => {
            type TestResource = NamedApiResource<DummyItem>;

            const mockResource: TestResource = {
                name: 'test-item',
                url: 'http://api.example.com/test/1',
            };

            // Structural check
            expect(mockResource).toHaveProperty('name');
            expect(typeof mockResource.name).toBe('string');
            expect(mockResource.name).toBe('test-item');

            expect(mockResource).toHaveProperty('url');
            expect(typeof mockResource.url).toBe('string');
            expect(mockResource.url).toBe('http://api.example.com/test/1');
        });

        it('should ensure the generic T parameter is not directly required in the resource structure', () => {
            // NamedApiResource only uses T as a type constraint, not required fields
            const mockResource: NamedApiResource<DummyItem> = {
                name: 'generic-item',
                url: 'http://api.example.com/generic/5',
            };

            // We just ensure the structure matches the definition.
            expect(Object.keys(mockResource).length).toBe(2);
        });
    });

    // --- Testing NamedApiResourceList<T> ---
    describe('NamedApiResourceList<T>', () => {
        // Define a concrete list type where T is the NamedApiResource structure
        type ListItem = NamedApiResource<DummyItem>;
        type TestList = NamedApiResourceList<ListItem>;

        const mockResults: ListItem[] = [
            { name: 'a-item', url: 'url/a' },
            { name: 'b-item', url: 'url/b' },
        ];

        const mockList: TestList = {
            count: 100,
            next: 'http://api.example.com/next_page',
            previous: '', // FIX: Changed 'null as unknown as string' to an actual empty string to satisfy the 'string' type and pass the runtime 'typeof' check.
            results: mockResults,
        };

        it('should correctly define the list metadata properties', () => {
            // count
            expect(mockList).toHaveProperty('count');
            expect(typeof mockList.count).toBe('number');
            expect(mockList.count).toBe(100);

            // next
            expect(mockList).toHaveProperty('next');
            expect(typeof mockList.next).toBe('string');
            expect(mockList.next).toBe('http://api.example.com/next_page');

            // previous
            expect(mockList).toHaveProperty('previous');
            expect(typeof mockList.previous).toBe('string');
            expect(mockList.previous).toBe('');
        });

        it('should correctly define the results array structure', () => {
            expect(mockList).toHaveProperty('results');
            expect(Array.isArray(mockList.results)).toBe(true);
            expect(mockList.results.length).toBe(2);
        });

        it('should ensure elements within results conform to the generic T structure', () => {
            const firstResult = mockList.results[0];

            // Should have structure defined by T (which is ListItem = NamedApiResource<DummyItem>)
            expect(firstResult).toHaveProperty('name');
            expect(firstResult).toHaveProperty('url');
            expect(firstResult.name).toBe('a-item');
        });

        it('should handle an empty resource list gracefully', () => {
            const emptyList: TestList = {
                count: 0,
                next: '',
                previous: '',
                results: [],
            };

            expect(emptyList.count).toBe(0);
            expect(emptyList.results).toEqual([]);
        });
    });
});