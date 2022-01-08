import { useRouter } from "next/router";
import ErrorPage from "next/error";
import Container from "../../components/container";
import PostBody from "../../components/post-body";
import Header from "../../components/header";
import PostHeader from "../../components/post-header";
import Layout from "../../components/layout";
import PostTitle from "../../components/post-title";
import Head from "next/head";
import { CMS_NAME } from "../../lib/constants";
import { staticRequest } from "tinacms";
import { useEffect, useState } from "react";
import markdownToHtml from "../../lib/markdownToHtml";

export default function Post({ data, slug }) {
  const { title, coverImage, date, author, body, ogImage } =
    data.getPostDocument.data;
  const router = useRouter();

  const [content, setContent] = useState("");

  useEffect(() => {
    const parseMarkdown = async () => {
      setContent(await markdownToHtml(body));
    };

    parseMarkdown();
  }, [body]);

  if (!router.isFallback && !slug) {
    return <ErrorPage statusCode={404} />;
  }
  return (
    <Layout preview={false}>
      <Container>
        <Header />
        {router.isFallback ? (
          <PostTitle>Loading…</PostTitle>
        ) : (
          <>
            <article className="mb-32">
              <Head>
                <title>
                  {title} | Next.js Blog Example with {CMS_NAME}
                </title>
                <meta property="og:image" content={ogImage.url} />
              </Head>
              <PostHeader
                title={title}
                coverImage={coverImage}
                date={date}
                author={author}
              />
              <PostBody content={content} />
            </article>
          </>
        )}
      </Container>
    </Layout>
  );
}

export const getStaticProps = async ({ params }) => {
  const { slug } = params;
  const variables = { relativePath: `${slug}.md` };
  const query = `
    query BlogPostQuery($relativePath: String!) {
      getPostDocument(relativePath: $relativePath) {
        data {
          title
          excerpt
          date
          coverImage
          author {
            name
            picture
          }
          ogImage {
            url
          }
          body
        }
      }
    }
  `;
  const data = await staticRequest({
    query: query,
    variables: variables,
  });

  return {
    props: {
      query,
      variables,
      data,
      slug,
    },
  };
};

export async function getStaticPaths() {
  const postsListData = await staticRequest({
    query: `
      query {
        getPostList {
          edges {
            node {
            sys {
              filename
              }
            }
          }
      }
    }
    `,
    variables: {},
  });
  return {
    paths: postsListData.getPostList.edges.map((edge) => ({
      params: { slug: edge.node.sys.filename },
    })),
    fallback: false,
  };
}
