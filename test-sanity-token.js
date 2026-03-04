import { createClient } from '@sanity/client';

const client = createClient({
    projectId: 'wn3a082f',
    dataset: 'production',
    apiVersion: '2025-01-01',
    token: 'sk3hcgzMrsNDGtMbwCUGbh3PJ0eRfnpnGI4LBXI0lWGZdvD8oYDB2cqZEdATKCUrmDceAAgkoG0zoYUuGw2N3dfXoNaU4ZvOUoTeraWE1la5BCdjg967sQawjJydQJMq1jtsomH56RPKaD3hpY2XhRBr6Z4Zf7dO157WTvDzbDyRNtxK3bsw',
    useCdn: false,
});

async function test() {
    console.log('--- Sanity Token Test ---');
    try {
        const count = await client.fetch('count(*[_type == "user"])');
        console.log('✅ READ OK: Database has', count, 'users.');

        console.log('Testing WRITE (dryRun)...');
        const result = await client.create({
            _type: 'user',
            email: 'p-test-' + Date.now() + '@example.com',
            name: 'Test Project Token',
            userType: 'email_subscriber',
            isActive: true,
            createdAt: new Date().toISOString()
        });
        console.log('✅ WRITE OK: Created user with ID:', result._id);

        // Clean up
        console.log('Cleaning up test user...');
        await client.delete(result._id);
        console.log('✅ DELETE OK');

    } catch (err) {
        console.error('❌ ERROR:', err.message);
        if (err.statusCode) console.error('Status Code:', err.statusCode);
        if (err.response && err.response.body) {
            console.error('Response Body:', JSON.stringify(err.response.body, null, 2));
        }
    }
}

test();
