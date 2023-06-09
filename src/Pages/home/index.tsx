import axios from 'axios';
import React from 'react';
import { BASE_URL, BOOKS_IN_PAGE, updateBooksData } from '../../utils';
import { useQuery, useQueryClient } from 'react-query';
import { VolumeResponse } from '../booksInfo';
import { BookCard } from '../../components/BookCard';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { ClockLoader } from 'react-spinners';
import { Pagination } from '../../components/Pagination/Pagination';
import SelectGenres from '../../components/Select/SelectGenres';
import { Search } from '../../components/Search';

const fetchBooks = async function (
  index = 0,
  searchValue: string = '',
  genre: string | undefined = '',
) {
  /**
   * When clicking on the pagination button, an error occurred:
   * the number of pages increased.
   * It turned out that the reason was an incorrectly composed request to the server.
   * To solve the problem,
   * the query was changed and the corresponding condition was added to the function
   * for processing a click on the pagination button.
   */
  let searchBooks = `subject:${genre}`;
  if (genre && searchValue !== '') {
    searchBooks = `intitle:${searchValue}+subject:${genre}`;
  }
  const { data } = await axios.get<VolumeResponse>(
    `${BASE_URL}&q=${searchBooks}&maxResults=${BOOKS_IN_PAGE}&startIndex=${index}`,
  );
  updateBooksData(data);
  const books = data.items;
  const totalBooks = data.totalItems;
  return { books, totalBooks };
};
const Home = () => {
  const [page, setPage] = React.useState(0);

  const searchValue = useSelector((state: RootState) => state.books.searchValue);
  const genre = useSelector((state: RootState) => state.books.genre?.value);
  const queryClient = useQueryClient();

  //load the page from the beginning
  React.useEffect(() => {
    setPage(0);
    queryClient.invalidateQueries('books');
  }, [searchValue, queryClient, genre]);

  const { data, isLoading, isSuccess } = useQuery(
    ['books', page, searchValue, genre],
    () => fetchBooks(page, searchValue, genre),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    },
  );

  const pageNow = page / BOOKS_IN_PAGE + 1;
  const totalPages = data ? Math.ceil(data?.totalBooks / BOOKS_IN_PAGE) : 0;

  const isLastPage = data ? pageNow === totalPages : true;

  if (isLoading) {
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <ClockLoader size={50} />
      </div>
    );
  }
  return (
    <>
      <div className="container relative">
        <div className="flex gap-10 flex-col mb-14 sm:flex-row sm:justify-between justify-center items-center ">
          <Search />
          <SelectGenres />
        </div>
        <div className=" flex justify-center">
          {isSuccess && data.books.length > 0 ? (
            <div className="flex flex-col gap-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-14 gap-x-14 last:mb-10">
                {data?.books.map((b) => (
                  <BookCard
                    id={b.id}
                    key={b.id}
                    image={b.volumeInfo.imageLinks.thumbnail}
                    title={b.volumeInfo.title}
                    author={b.volumeInfo.authors[0]}
                    rating={b.volumeInfo.averageRating}
                  />
                ))}
              </div>

              <Pagination
                totalPages={totalPages}
                setPage={setPage}
                isLastPage={isLastPage}
                page={page}
                pageNow={pageNow}
              />
            </div>
          ) : (
            <div>The books were not found</div>
          )}
        </div>
      </div>
    </>
  );
};
export default Home;
